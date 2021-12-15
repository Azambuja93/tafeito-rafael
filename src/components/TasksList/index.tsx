import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Delete from "@mui/icons-material/Delete";
import AttachFile from "@mui/icons-material/AttachFile";
import Label from "@mui/icons-material/Label";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Task, Category, Tag } from "../../common/types";
import { useAxios } from "../../hooks/useAxios";
import TagsInput from "../TagsInput";
import { FileDownload } from "@mui/icons-material";
import axios from "axios";
import { FileDownload, FileDownloadOff } from "@mui/icons-material";

type TasksListProps = {
  tasks: Task[];
  category: Category;
  updateTasks: () => void;
}

type ResponseDeleteTask = {

}

type ResponsePatchTask = {

}

export default function TasksList(props:TasksListProps) {
  const {
    category,
    tasks,
    updateTasks
  } = props;

  const [attachments, setAttachments] = React.useState<any>(
    tasks.map((task) => task.id).reduce((a, v) => ({ ...a, [v]: "" }), {})
  );

  const item = window.localStorage.getItem("token");
  const tokenObj = JSON.parse(item!);

  React.useEffect(() => {
    async function fetchAttachments() {
      const result = await Promise.all(
        tasks.map((task) => {
          return axios({
            method: "GET",
            url: `http://localhost:8080/tarefas/${task.id}/anexos`,
            headers: { Authorization: `Bearer ${tokenObj!.token}` },
          })
            .then((response) => ({ [task.id]: response.data.nome }))
            .catch(() => ({ [task.id]: "" }));
        })
      );

      setAttachments(Object.assign({}, ...result));
    }

    fetchAttachments();
  }, []);

  const [checked, setChecked] = React.useState([0]);

  const handleToggle = (value: number) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const {
    commit: commitTask,
    response: taskId
  } = useAxios<ResponseDeleteTask>({
    method: 'DELETE',
    path: `tarefas`
  });

  const {
    commit: commitFinishTask,
  } = useAxios<ResponsePatchTask>({
    method: 'POST',
    path: `tarefas/:id/concluir`
  });

  const {
    commit: commitReopenTask,
  } = useAxios<ResponsePatchTask>({
    method: 'POST',
    path: `tarefas/:id/reabrir`
  });

  const {
    commit: commitAddTag,
  } = useAxios<ResponsePatchTask>({
    method: 'POST',
    path: `tarefas/:id/etiquetas`
  });

  const {
    commit: commitRemoveTag,
  } = useAxios<ResponsePatchTask>({
    method: 'DELETE',
    path: `tarefas/:id/etiquetas`
  });

  const deleteTask = (taskId:number) => {
    commitTask({}, updateTasks, `tarefas/${taskId}`)
  }

  const updateTaskStatus = (taskId:number, status:boolean) => {
    if(status === true) {
      commitFinishTask({}, updateTasks, `tarefas/${taskId}/concluir`)
    } else {
      commitReopenTask({}, updateTasks, `tarefas/${taskId}/reabrir`)
    }
  }
  const addTag = (taskId:number, newTag:Tag) => {

    commitAddTag({
      etiqueta: newTag.etiqueta
    }, updateTasks, `tarefas/${taskId}/etiquetas`)
  }

  const removeTag = (taskId:number, removedTag:Tag) => {

    commitRemoveTag({}, updateTasks, `tarefas/${taskId}/etiquetas/${removedTag.etiqueta}`)
  }
  return (
    <>
    <Typography variant='h4' >
      {category.descricao}
    </Typography>
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {tasks.map((task) => {
        const labelId = `checkbox-list-label-${task.id}`;

        return (
          <ListItem
            key={task.id}
            secondaryAction={
              <Stack direction='row' spacing={1}>
                {attachments[task.id as any] ? (
                    <Tooltip title="Remover Anexo">
                      <IconButton
                        edge="end"
                        aria-label="remover"
                        onClick={async () => {
                          await axios({
                            method: "DELETE",
                            url: `http://localhost:8080/tarefas/${task.id}/anexos`,
                            headers: {
                              Authorization: `Bearer ${tokenObj!.token}`,
                            },
                            responseType: "blob",
                          });

                          setAttachments((s: any) => ({
                            ...s,
                            [task.id]: "",
                          }));
                        }}
                      >
                        <FileDownloadOff />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                      <input
                        id={`file-input-${task.id}`}
                        type="file"
                        hidden
                        onChange={async (event) => {
                          const input = event.currentTarget;

                          if (input.files) {
                            const formData = new FormData();
                            formData.append("arquivo", input.files[0]);
                            const { data } = await axios({
                              method: "POST",
                              url: `http://localhost:8080/tarefas/${task.id}/anexos`,
                              headers: {
                                Authorization: `Bearer ${tokenObj!.token}`,
                              },
                              data: formData,
                            });
                            setAttachments((s: any) => ({
                              ...s,
                              [task.id]: data.nome,
                            }));
                          }
                        }}
                      />

                  <AttachFile />
                </IconButton>
                </Tooltip>
                <Tooltip title='Excluir tarefa'>
                <IconButton edge="end" aria-label="excluir" onClick={() => {deleteTask(task.id)}}>
                  <Delete />
                </IconButton>
                </Tooltip>
              </Stack>
              }
            }
            disablePadding
          >
            <ListItem role={undefined} dense>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={task.concluida}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                  onChange={(event:React.ChangeEvent<HTMLInputElement>) => updateTaskStatus(task.id, event.target.checked)}
                />
              </ListItemIcon>
              <ListItemText id={labelId} 
                primary={task.descricao} 
                sx={{textDecoration:task.concluida ? 'line-through' : 'none'}}
                secondary={(
                <TagsInput
                  selectedTags={(newTags) => {}}
                  addTag={(newTag) => addTag(task.id, newTag)}
                  removeTag={(removedTag) => removeTag(task.id, removedTag)}
                  tags={task.etiquetas}
                  placeholder="add Tags"
                />)} 
              />
            </ListItem>
            
          </ListItem>
        );
      })}
    </List>
    </>
  );
}